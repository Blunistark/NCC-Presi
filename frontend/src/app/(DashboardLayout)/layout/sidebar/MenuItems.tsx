import {
  IconLayoutDashboard,
  IconUsers,
  IconCalendarEvent,
  IconFlag,
  IconSpeakerphone,
  IconLogout,
  IconBriefcase,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/ano",
  },
  {
    id: uniqueId(),
    title: "Cadets",
    icon: IconUsers,
    href: "/cadets",
  },
  {
    id: uniqueId(),
    title: "Attendance",
    icon: IconCalendarEvent,
    href: "/attendance",
  },
  {
    id: uniqueId(),
    title: "Parades/Events",
    icon: IconFlag,
    href: "/parades",
  },
  {
    id: uniqueId(),
    title: "On Duty",
    icon: IconBriefcase,
    href: "/od",
  },
  {
    id: uniqueId(),
    title: "Announcements",
    icon: IconSpeakerphone,
    href: "/announcements",
  },
  {
    id: uniqueId(),
    title: "Register",
    icon: IconUsers,
    href: "/register",
  },
  {
    id: uniqueId(),
    title: "Logout",
    icon: IconLogout,
    href: "/authentication/login",
  },
];

export default Menuitems;
