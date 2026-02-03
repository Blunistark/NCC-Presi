import React from "react";
import Menuitems from "./MenuItems";
import { Box, Typography } from "@mui/material";
import {
  Logo,
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
  Submenu,
} from "react-mui-sidebar";
import { IconPoint } from '@tabler/icons-react';
import Link from "next/link";
import { usePathname } from "next/navigation";



const renderMenuItems = (items: any, pathDirect: any) => {

  return items.map((item: any) => {

    const Icon = item.icon ? item.icon : IconPoint;

    const itemIcon = <Icon stroke={1.5} size="1.3rem" />;

    if (item.subheader) {
      // Display Subheader
      return (
        <Menu
          subHeading={item.subheader}
          key={item.subheader}
        />
      );
    }

    //If the item has children (submenu)
    if (item.children) {
      return (
        <Submenu
          key={item.id}
          title={item.title}
          icon={itemIcon}
          borderRadius='7px'
        >
          {renderMenuItems(item.children, pathDirect)}
        </Submenu>
      );
    }

    // If the item has no children, render a MenuItem

    return (
      <Box px={3} key={item.id}>
        <MenuItem
          key={item.id}
          isSelected={pathDirect === item?.href}
          borderRadius='8px'
          icon={itemIcon}
          link={item.href}
          component={Link}
        >
          {item.title}
        </MenuItem >
      </Box>

    );
  });
};


const SidebarItems = ({ isCollapsed = false }: { isCollapsed?: boolean }) => {
  const pathname = usePathname();
  const pathDirect = pathname;

  return (
    <Box sx={{ px: isCollapsed ? 1 : 2 }}>
      <MUI_Sidebar
        width={"100%"}
        showProfile={false}
        themeColor={"#5D87FF"}
        themeSecondaryColor={'#49beff'}
        collapseSidebar={isCollapsed}
      >

        <Logo img='/images/logos/dark-logo.svg' component={Link} to="/ano">
          {!isCollapsed && "Modernize"}
        </Logo>

        {renderMenuItems(Menuitems, pathDirect)}
      </MUI_Sidebar>
    </Box>
  );
};
export default SidebarItems;
