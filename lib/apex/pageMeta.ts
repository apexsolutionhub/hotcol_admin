export type ApexPageMeta = {
  title: string;
  description: string;
};

export function getApexPageMeta(
  pathname: string,
  searchParams: URLSearchParams,
): ApexPageMeta {
  if (pathname === "/dashboard") {
    return {
      title: "Overview",
      description: "Platform health and pending work at a glance",
    };
  }
  if (pathname === "/tenants") {
    if (
      searchParams.get("filter") === "inactive" ||
      searchParams.get("filter") === "setup_pending"
    ) {
      return {
        title: "Inactive Tenants",
        description: "Suspended, banned, and deleted properties",
      };
    }
    return {
      title: "Tenants",
      description: "Search and manage every HotCol property",
    };
  }
  if (pathname.startsWith("/tenants/")) {
    return {
      title: "Tenant detail",
      description: "Billing, access control, and staff accounts",
    };
  }
  if (pathname === "/payments/setup") {
    return {
      title: "Setup payments",
      description: "Review and approve one-time setup fee submissions",
    };
  }
  if (pathname === "/payments/quarterly") {
    return {
      title: "Quarterly payments",
      description: "Review and approve quarterly subscription payments for cafés and restaurants",
    };
  }
  if (pathname === "/payments/yearly") {
    return {
      title: "Yearly payments",
      description: "Review and approve yearly hotel subscription payments",
    };
  }
  if (pathname === "/payments") {
    return {
      title: "Setup payments",
      description: "Review and approve one-time setup fee submissions",
    };
  }
  if (pathname === "/feedback") {
    return {
      title: "Property chat",
      description: "Two-way conversations with hotels and cafés — start or continue any thread",
    };
  }
  if (pathname === "/users") {
    if (searchParams.get("filter") === "disabled") {
      return {
        title: "Disabled logins",
        description: "Staff accounts with login disabled across all properties",
      };
    }
    return {
      title: "Tenant users",
      description: "Monitor staff accounts across cafés, restaurants, hotels, resorts, and pensions",
    };
  }
  if (pathname === "/audit") {
    return {
      title: "Audit log",
      description: "Apex team actions on tenants, users, and billing",
    };
  }
  if (pathname === "/signups") {
    return {
      title: "New signups",
      description: "Registrations awaiting setup fee approval",
    };
  }
  if (pathname === "/modules") {
    return {
      title: "Module requests",
      description: "Pending module enable/disable requests from properties",
    };
  }
  if (pathname === "/order-mode") {
    return {
      title: "Order mode requests",
      description: "Pending digital vs analog café order mode switches",
    };
  }
  if (pathname.startsWith("/feedback/")) {
    return {
      title: "Conversation",
      description: "Chat with the property team in real time",
    };
  }
  return {
    title: "Dashboard",
    description: "HotCol tenant management",
  };
}
