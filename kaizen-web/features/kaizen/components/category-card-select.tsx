import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/features/kaizen/constants/category-icons";
import type { Category } from "@/features/kaizen/types/lookup";

interface CategoryCardSelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
}

export function CategoryCardSelect({ categories, value, onChange }: CategoryCardSelectProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Category"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.icon);
        const isSelected = category.id === value;

        return (
          <Card
            key={category.id}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => onChange(category.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChange(category.id);
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 p-4 text-center transition-colors",
              isSelected ? "border-primary ring-primary ring-2" : "hover:border-primary/50",
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">{category.name}</p>
            {category.description ? (
              <p className="text-muted-foreground text-xs">{category.description}</p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
