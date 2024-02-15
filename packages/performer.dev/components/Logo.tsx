import Image from "next/image";
import logo from "../assets/performer-no-fill-no-line.svg";

export function Logo(props: any) {
  return <Image src={logo} alt="logo" {...props} />;
}
