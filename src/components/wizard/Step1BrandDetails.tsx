'use client';
import { useAuditStore } from '@/store/auditStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChipMultiSelect } from '@/components/shared/ChipMultiSelect';

export function Step1BrandDetails() {
  const { wizard, updateFormData, updateAuditMeta } = useAuditStore();
  const d = wizard.formData;
  const m = wizard.auditMeta;

  const field = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    updateFormData({ [key]: e.target.value });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Brand Details</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Brand Name *</Label>
          <Input value={d.brandName || ''} onChange={field('brandName')} placeholder="e.g. Prestige Group" />
        </div>
        <div>
          <Label>Legal Name</Label>
          <Input value={d.legalName || ''} onChange={field('legalName')} placeholder="Registered company name" />
        </div>
        <div>
          <Label>City</Label>
          <Input value={d.city || ''} onChange={field('city')} placeholder="e.g. Bengaluru" />
        </div>
        <div>
          <Label>Positioning</Label>
          <Input value={d.positioning || ''} onChange={field('positioning')} placeholder="e.g. Luxury, Affordable, Mid-premium" />
        </div>
        <div>
          <Label>Product Type</Label>
          <Input value={d.productType || ''} onChange={field('productType')} placeholder="e.g. Apartments, Villas, Mixed-use" />
        </div>
        <div>
          <Label>Year Established</Label>
          <Input type="number" value={d.yearEstablished || ''} onChange={e => updateFormData({ yearEstablished: parseInt(e.target.value) || undefined })} placeholder="e.g. 2005" />
        </div>
        <div>
          <Label>Promoter Name</Label>
          <Input value={d.promoterName || ''} onChange={field('promoterName')} placeholder="Founder / MD name" />
        </div>
      </div>
      <div>
        <Label>Target Segments</Label>
        <ChipMultiSelect value={d.targetSegments || []} onChange={v => updateFormData({ targetSegments: v })} placeholder="Add segment (e.g. HNI, NRI, Young professionals)..." />
      </div>
      <div>
        <Label>Micro Markets</Label>
        <ChipMultiSelect value={d.microMarkets || []} onChange={v => updateFormData({ microMarkets: v })} placeholder="Add location (e.g. Whitefield, Bandra West)..." />
      </div>
      <div className="border-t pt-4">
        <Label>Auditor Name</Label>
        <Input value={m.auditorName || ''} onChange={e => updateAuditMeta({ auditorName: e.target.value })} placeholder="Your name" />
      </div>
      <div>
        <Label>Audit Objective</Label>
        <Textarea value={m.objective || ''} onChange={e => updateAuditMeta({ objective: e.target.value })} placeholder="What are you evaluating this brand for?" />
      </div>
      <div>
        <Label>Known Red Flags (optional)</Label>
        <Textarea value={m.knownRedFlags || ''} onChange={e => updateAuditMeta({ knownRedFlags: e.target.value })} placeholder="Any known concerns to investigate?" />
      </div>
    </div>
  );
}
