import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ParametresPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Paramètres"
        description="Informations société, TVA et numérotation des factures."
      />
      <SettingsForm
        initialValues={{
          companyName: settings.companyName,
          companyAddress: settings.companyAddress,
          companyPhone: settings.companyPhone,
          companyEmail: settings.companyEmail,
          ice: settings.ice,
          defaultVatRate: Number(settings.defaultVatRate),
          invoicePrefix: settings.invoicePrefix,
          invoiceNumberPadding: settings.invoiceNumberPadding,
          eurToMad: Number(settings.eurToMad),
          usdToMad: Number(settings.usdToMad),
          cnyToMad: Number(settings.cnyToMad),
          companyLogoUrl: settings.companyLogoUrl,
        }}
      />
      <ChangePasswordForm />
    </div>
  );
}
