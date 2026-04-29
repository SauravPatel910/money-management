import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type {
  AccountInput,
  PersonDirection,
  TransactionInput,
  TransactionType,
} from "@/types/money";
import { toAmount } from "@/lib/moneyCalculations";
import { UnauthorizedError } from "@/server/authSession";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const TRANSACTION_TYPES: TransactionType[] = [
  "income",
  "expense",
  "transfer",
  "person",
];
const PERSON_DIRECTIONS: PersonDirection[] = ["to", "from"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (
  payload: Record<string, unknown>,
  field: string,
  required = false,
) => {
  const value = payload[field];
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(`${field} is required`);
    }
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`);
  }

  const trimmed = value.trim();
  if (required && !trimmed) {
    throw new ValidationError(`${field} is required`);
  }

  return trimmed || undefined;
};

const parseAmount = (value: unknown, required = false) => {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError("amount is required");
    }
    return undefined;
  }

  const amount = toAmount(value);
  if (amount <= 0) {
    throw new ValidationError("amount must be greater than 0");
  }

  return amount;
};

const getTransactionType = (
  payload: Record<string, unknown>,
  required = false,
) => {
  const type = getString(payload, "type", required);
  if (type === undefined) {
    return undefined;
  }

  if (!TRANSACTION_TYPES.includes(type as TransactionType)) {
    throw new ValidationError("type is not supported");
  }

  return type as TransactionType;
};

const getPersonDirection = (
  payload: Record<string, unknown>,
  required = false,
) => {
  const direction = getString(payload, "direction", required);
  if (direction === undefined) {
    return undefined;
  }

  if (!PERSON_DIRECTIONS.includes(direction as PersonDirection)) {
    throw new ValidationError("direction must be to or from");
  }

  return direction as PersonDirection;
};

export const validateAccountPayload = (
  payload: unknown,
  mode: "create" | "update",
): Partial<AccountInput> => {
  if (!isRecord(payload)) {
    throw new ValidationError("Request body must be an object");
  }

  const account: Partial<AccountInput> = {};

  const name = getString(payload, "name", mode === "create");
  if (name !== undefined) {
    account.name = name;
  }

  const id = getString(payload, "id");
  const owner = getString(payload, "owner");
  const icon = getString(payload, "icon");

  if (id !== undefined) {
    account.id = id;
  }
  if (owner !== undefined) {
    account.owner = owner;
  }
  if (icon !== undefined) {
    account.icon = icon;
  }

  if (mode === "update") {
    const hasUpdates =
      payload.name !== undefined ||
      payload.owner !== undefined ||
      payload.icon !== undefined;
    if (!hasUpdates) {
      throw new ValidationError("At least one account field is required");
    }
  }

  return account;
};

export const validateTransactionPayload = (
  payload: unknown,
  mode: "create" | "update",
): Partial<TransactionInput> => {
  if (!isRecord(payload)) {
    throw new ValidationError("Request body must be an object");
  }

  const transaction: Partial<TransactionInput> = {};
  const requireFull = mode === "create";
  const type = getTransactionType(payload, requireFull);

  if (type !== undefined) {
    transaction.type = type;
  }

  const amount = parseAmount(payload.amount, requireFull);
  if (amount !== undefined) {
    transaction.amount = amount;
  }

  const account = getString(payload, "account");
  const from = getString(payload, "from");
  const to = getString(payload, "to");
  const direction = getPersonDirection(payload);
  const person = getString(payload, "person");
  const note = getString(payload, "note");
  const transactionDate = getString(payload, "transactionDate", requireFull);
  const transactionTime = getString(payload, "transactionTime");
  const entryDate = getString(payload, "entryDate", requireFull);
  const entryTime = getString(payload, "entryTime");

  if (account !== undefined) transaction.account = account;
  if (from !== undefined) transaction.from = from;
  if (to !== undefined) transaction.to = to;
  if (direction !== undefined) transaction.direction = direction;
  if (person !== undefined) transaction.person = person;
  if (note !== undefined) transaction.note = note;
  if (mode === "update" && payload.note !== undefined && note === undefined) {
    transaction.note = "";
  }
  if (transactionDate !== undefined) transaction.transactionDate = transactionDate;
  if (transactionTime !== undefined) transaction.transactionTime = transactionTime;
  if (entryDate !== undefined) transaction.entryDate = entryDate;
  if (entryTime !== undefined) transaction.entryTime = entryTime;

  if (type === "income" || type === "expense") {
    getString(payload, "account", requireFull);
  }

  if (type === "transfer") {
    const requiredFrom = getString(payload, "from", requireFull);
    const requiredTo = getString(payload, "to", requireFull);
    if (requiredFrom && requiredTo && requiredFrom === requiredTo) {
      throw new ValidationError("from and to accounts must be different");
    }
  }

  if (type === "person") {
    getString(payload, "account", requireFull);
    getString(payload, "person", requireFull);
    getPersonDirection(payload, requireFull);
  }

  if (mode === "update" && Object.keys(transaction).length === 0) {
    throw new ValidationError("At least one transaction field is required");
  }

  return transaction;
};

export const jsonError = (message: string, status: number) =>
  NextResponse.json({ message }, { status });

export const handleApiError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, 401);
  }

  if (error instanceof ValidationError) {
    return jsonError(error.message, 400);
  }

  if (error instanceof SyntaxError) {
    return jsonError("Invalid JSON body", 400);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return jsonError("Record not found", 404);
    }

    if (error.code === "P2002") {
      return jsonError("Record already exists", 400);
    }
  }

  if (error instanceof Error) {
    const badRequestMessages = [
      "Transaction amount must be greater than 0",
      "Unsupported transaction type",
      "Account is required",
      "From and to accounts are required",
      "Transfer from and to accounts must be different",
      "Person name is required",
      "Person transaction direction must be to or from",
      "The Cash account cannot be deleted.",
      "Cannot delete account that has transactions",
    ];

    if (badRequestMessages.some((message) => error.message.includes(message))) {
      return jsonError(error.message, 400);
    }
  }

  return jsonError(fallbackMessage, 500);
};
