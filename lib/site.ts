export const SITE = {
  name: "Gfinpay",
  legalName: "GATEWAYLINE FINTECH PRIVATE LIMITED",
  cin: "U62099WB2024PTC268915",
  roc: "ROC Kolkata II",
  registrationNumber: "268915",
  incorporatedOn: "5 March 2024",
  registeredAddress:
    "PS Abacus, Unit 308, Plot No. IIE/23, New Town, PS ECO PARK, North 24 Parganas, West Bengal, India, 700161",
  tagline: "Send money, pay bills, and give cash from the neighbourhood retailer",
  description:
    "Gfinpay helps kirana retailers send money, pay BBPS bills, recharge mobile and DTH, top up FASTag, collect LIC premiums, give cash against UPI or Aadhaar, keep a wallet, and help customers take an FD card. Banks keep the deposits. Retailers run the counter.",
  url: "https://gfinpay.com",
  email: "info@gfinpay.com",
  partnerEmail: "partners@gfinpay.com",
  phone: "+91 88810 02111",
  phoneHref: "tel:+918881002111",
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
} as const;
