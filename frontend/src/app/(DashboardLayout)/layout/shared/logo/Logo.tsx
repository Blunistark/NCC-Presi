import Link from "next/link";
import { styled } from "@mui/material";
import Image from "next/image";

const LinkStyled = styled(Link)(() => ({
  height: "180px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
    <LinkStyled href="/">
      <Image src="/images/logos/ncc-logo.png" alt="logo" height={174} width={174} priority style={{ borderRadius: '15px' }} />
    </LinkStyled>
  );
};

export default Logo;
