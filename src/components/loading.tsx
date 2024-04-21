type Props = {
  size?: "sx" | "sm" | "md" | "lg";
};

export const LoadingSpinner = (props: Props) => {
  return (
    <span
      className={`loading loading-spinner loading-${props.size ?? "md"}`}
    ></span>
  );
};

export const LoadingPage = () => {
  return (
    <div className="absolute right-0 top-0 flex h-screen w-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
};
