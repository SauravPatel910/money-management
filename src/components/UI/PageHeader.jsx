import { Link } from "@tanstack/react-router";

const PageHeader = ({ title, links = [] }) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-primary-800">{title}</h1>
      <div className="flex gap-2">
        {links.map(({ to, text, key }) => (
          <Link
            key={key || to}
            to={to}
            className="transform rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            {text}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PageHeader;
