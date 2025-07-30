import { useState } from "react";
import { api } from "~/utils/api";

interface CategoryManagerProps {
  onCategoryUpdate?: () => void;
}

export default function CategoryManager({
  onCategoryUpdate: _onCategoryUpdate,
}: CategoryManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: categories } = api.items.getCategories.useQuery();
  const { data: allItems } = api.items.getAll.useQuery({
    category: "concession",
  });

  const getCategoryItemCount = (category: string) => {
    return (
      allItems?.filter(
        (item) => item.item.isConcessionItem && item.item.category === category,
      ).length ?? 0
    );
  };

  const getUncategorizedItems = () => {
    return (
      allItems?.filter(
        (item) => item.item.isConcessionItem && !item.item.category,
      ) ?? []
    );
  };

  return (
    <div className="rounded-lg border border-base-300 bg-base-100 shadow-sm">
      {/* Compact Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-base-200/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-base-content">Category Management</h3>
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <span>({categories?.length ?? 0} categories)</span>
            {getUncategorizedItems().length > 0 && (
              <span className="badge badge-warning badge-xs">
                {getUncategorizedItems().length} uncategorized
              </span>
            )}
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`h-4 w-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-4 border-t border-base-300 p-4">
          {/* Current Categories */}
          {categories && categories.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-base-content/80">
                Current Categories
              </h4>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category: string) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded bg-base-200 p-2 text-sm"
                  >
                    <span className="font-medium">{category}</span>
                    <span className="text-xs text-base-content/60">
                      {getCategoryItemCount(category)} items
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncategorized Items Warning */}
          {getUncategorizedItems().length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
              <h4 className="mb-1 text-sm font-medium text-base-content">
                {getUncategorizedItems().length} Uncategorized Items
              </h4>
              <p className="text-xs text-base-content/70">
                Use the inline editing or item forms to assign categories to:{" "}
                {getUncategorizedItems()
                  .slice(0, 3)
                  .map((item, index) => (
                    <span key={item.item.id}>
                      {item.item.label}
                      {index <
                        Math.min(2, getUncategorizedItems().length - 1) && ", "}
                    </span>
                  ))}
                {getUncategorizedItems().length > 3 &&
                  ` and ${getUncategorizedItems().length - 3} more`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
