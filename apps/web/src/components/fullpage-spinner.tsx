import { Spinner } from "./ui/spinner";

const FullPageSpinner = () => {
  return (
    <div className="relative h-screen w-screen">
      <Spinner className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 transform" />
    </div>
  );
};

export default FullPageSpinner;
