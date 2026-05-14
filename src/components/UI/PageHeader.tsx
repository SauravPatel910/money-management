"use client";

import Link from "next/link";
import type { NavigationLink } from "../common/getNavigationLinks";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

type PageHeaderProps = {
  title: string;
  links?: NavigationLink[];
};

const PageHeader = ({ title, links = [] }: PageHeaderProps) => {
  const { isEnabled } = useFeatureFlags();
  const visibleLinks = links.filter((link) => isEnabled(link.feature));

  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-[28px] font-semibold leading-none text-[#343c6a]">
        {title}
      </h1>
      <div className="flex flex-wrap gap-2">
        {visibleLinks.map(({ to, text, key }) => (
          <Link
            key={key || to}
            href={to}
            className="rounded-full border border-[#dfeaf2] bg-white px-4 py-2 text-sm font-medium text-[#343c6a] transition-colors hover:border-[#2d60ff] hover:text-[#2d60ff]"
          >
            {text}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PageHeader;
