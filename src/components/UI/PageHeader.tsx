import Link from "next/link";
import type { NavigationLink } from "../common/getNavigationLinks";

type PageHeaderProps = {
  title: string;
  links?: NavigationLink[];
};

const PageHeader = ({ title, links = [] }: PageHeaderProps) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-primary-800">{title}</h1>
      <div className="flex gap-2">
        {links.map(({ to, text, key }) => (
          <Link
            key={key || to}
            href={to}
            className="transform rounded-lg bg-linear-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            {text}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PageHeader;
