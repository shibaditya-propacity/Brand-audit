'use client';
import { useAuditStore } from '@/store/auditStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChipMultiSelect } from '@/components/shared/ChipMultiSelect';
import { CollateralDocUpload } from '@/components/shared/CollateralDocUpload';

const AD_PLATFORM_OPTIONS = ['Meta (Facebook/Instagram)', 'Google Ads', 'YouTube Ads', 'LinkedIn Ads', '99acres', 'Housing.com', 'MagicBricks'];
const CRM_OPTIONS = ['Salesforce', 'HubSpot', 'Zoho CRM', 'LeadSquared', 'Sell.do', 'Custom', 'None'];

export function Step3Collateral() {
  const { wizard, updateFormData } = useAuditStore();
  const d = wizard.formData;
  const field = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => updateFormData({ [key]: e.target.value });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Market & Technology</h2>
      {/* Collateral Documents */}
      <div className="space-y-1.5">
        <Label>Collateral Documents <span className="text-slate-400 font-normal">(optional, PDF only · up to 3)</span></Label>
        <CollateralDocUpload
          value={d.collateralDocs ?? []}
          onChange={docs => updateFormData({ collateralDocs: docs })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Competitors (up to 5)</Label>
          <ChipMultiSelect value={d.competitors || []} onChange={v => updateFormData({ competitors: v })} placeholder="Add competitor brand name..." />
        </div>
        <div>
          <Label>RERA State</Label>
          <Input value={d.reraState || ''} onChange={field('reraState')} placeholder="e.g. Karnataka, Maharashtra" />
        </div>
        <div>
          <Label>Ad Spend Range (monthly)</Label>
          <Input value={d.adSpendRange || ''} onChange={field('adSpendRange')} placeholder="e.g. ₹5L–₹10L" />
        </div>
        <div className="col-span-2">
          <Label>RERA Numbers</Label>
          <ChipMultiSelect value={d.reraNumbers || []} onChange={v => updateFormData({ reraNumbers: v })} placeholder="Add RERA number..." />
        </div>
        <div className="col-span-2">
          <Label>Ad Platforms</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {AD_PLATFORM_OPTIONS.map(p => (
              <button key={p} type="button"
                onClick={() => {
                  const current = d.adPlatforms || [];
                  updateFormData({ adPlatforms: current.includes(p) ? current.filter(x => x !== p) : [...current, p] });
                }}
                className={`rounded-full px-3 py-1 text-xs border transition-colors ${(d.adPlatforms || []).includes(p) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>CRM Tool</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CRM_OPTIONS.map(p => (
              <button key={p} type="button"
                onClick={() => updateFormData({ crmTool: p })}
                className={`rounded-full px-3 py-1 text-xs border transition-colors ${d.crmTool === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-primary'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Promoter LinkedIn</Label>
          <Input value={d.promoterLinkedIn || ''} onChange={field('promoterLinkedIn')} placeholder="LinkedIn profile URL" />
        </div>
        <div>
          <Label>99acres Listing URL</Label>
          <Input value={d.acres99Url || ''} onChange={field('acres99Url')} placeholder="https://99acres.com/..." />
        </div>
        <div>
          <Label>Housing.com URL</Label>
          <Input value={d.housingUrl || ''} onChange={field('housingUrl')} placeholder="https://housing.com/..." />
        </div>
      </div>
    </div>
  );
}
