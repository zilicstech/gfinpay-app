import { ApplyNotice } from "../ApplyNotice";

export default function ApplyNotFound() {
  return (
    <ApplyNotice
      title="Page not found"
      body="This application link is not valid, or it has already been removed. Ask the retailer for a new link."
    />
  );
}
