import classNames from "classnames";

export function Grid({ children, className = "", cols = 12 }) {
  return (
    <div
      className={classNames(
        "grid gap-4",
        `grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-${cols}`,
        className
      )}
    >
      {children}
    </div>
  );
}

Grid.Col = function Col({ children, className = "", span = 1 }) {
  return (
    <div className={classNames(`col-span-${span}`, className)}>{children}</div>
  );
};
