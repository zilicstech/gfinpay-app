export const SITE = {
  name: "gfinpay",
  legalName: "GATEWAYLINE FINTECH PRIVATE LIMITED",
  cin: "U62099WB2024PTC268915",
  tagline: "Send money, pay bills, and give cash from the neighbourhood retailer",
  description:
    "gfinpay helps kirana retailers send money, pay BBPS bills, recharge mobile and DTH, top up FASTag, collect LIC premiums, give cash against UPI or Aadhaar, keep a wallet, and help customers take an FD card. Banks keep the deposits. Retailers run the counter.",
  url: "https://www.gfinpay.com",
  email: "hello@gfinpay.com",
  partnerEmail: "partners@gfinpay.com",
  phone: "1800 890 4040",
  address: "Kolkata · Mumbai · Bengaluru · Hyderabad",
} as const;

export const NAV = {
  services: [
    { href: "/services/domestic-money-transfer", label: "Send money", blurb: "Cash to any bank account" },
    { href: "/services/bbps", label: "Bill pay", blurb: "Electricity, water, gas, and more" },
    { href: "/services/recharge", label: "Mobile & DTH", blurb: "Prepaid and TV recharge" },
    { href: "/services/fastag", label: "FASTag", blurb: "Vehicle tag top-up" },
    { href: "/services/lic", label: "LIC premium", blurb: "Collect a life premium" },
    { href: "/services/aeps", label: "Aadhaar cash", blurb: "Give cash with thumb print" },
    { href: "/services/upi-cash-out", label: "UPI to cash", blurb: "QR in, cash out" },
    { href: "/services/agent-wallet", label: "Retailer wallet", blurb: "Add money, then transact" },
    { href: "/services/fd-credit-cards", label: "FD cards", blurb: "Help customer take a card" },
    { href: "/services/bc-network", label: "Retailer network", blurb: "Admin, distributor, retailer" },
  ],
  solutions: [
    { href: "/solutions/retailers", label: "For retailers" },
    { href: "/solutions/distributors", label: "For distributors" },
    { href: "/solutions/enterprises", label: "For banks" },
  ],
} as const;
