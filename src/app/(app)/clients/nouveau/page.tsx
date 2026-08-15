import { createCustomer } from "@/actions/customers";
import { CustomerForm } from "@/components/clients/CustomerForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NouveauClientPage() {
  return (
    <div>
      <PageHeader title="Nouveau client" />
      <CustomerForm action={createCustomer} />
    </div>
  );
}
