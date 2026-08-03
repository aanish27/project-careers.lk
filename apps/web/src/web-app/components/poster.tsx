import Image from "next/image";

export function Poster() {
  return (
    <div className="rounded">
      <Image
        src="/poster.png"
        alt="logo"
        width={100}
        height={100}
        className="h-auto w-full"
      />
    </div>
  );
}

export default Poster;
