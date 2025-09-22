import { FieldMapping } from './claims'

export interface CarrierPattern {
  name: string
  aliases: string[]
  headerPatterns: string[]
  fieldPatterns: Record<string, string[]>
  requiredColumns: string[]
  dateFormats: string[]
  amountFormats: string[]
  defaultMapping: FieldMapping
}

export interface CarrierDetectionResult {
  carrier: string
  confidence: number
  indicators: string[]
  suggestedMapping: FieldMapping
  dateFormat?: string
  amountFormat?: string
}

export const KNOWN_CARRIERS: CarrierPattern[] = [
  {
    name: 'Anthem',
    aliases: ['anthem', 'wellpoint', 'elevance'],
    headerPatterns: ['anthem', 'member', 'subscriber'],
    fieldPatterns: {
      claimantId: ['member_id', 'subscriber_id', 'member_number'],
      claimDate: ['service_date', 'date_of_service', 'claim_date'],
      serviceType: ['service_type', 'claim_type', 'benefit_category'],
      medicalAmount: ['medical_paid', 'medical_amount', 'paid_amount'],
      pharmacyAmount: ['rx_paid', 'pharmacy_paid', 'drug_amount']
    },
    requiredColumns: ['member_id', 'service_date', 'paid_amount'],
    dateFormats: ['MM/DD/YYYY', 'YYYY-MM-DD'],
    amountFormats: ['$0.00', '0.00'],
    defaultMapping: {
      claimantId: 'member_id',
      claimDate: 'service_date',
      serviceType: 'service_type',
      medicalAmount: 'medical_paid',
      pharmacyAmount: 'rx_paid'
    }
  },
  {
    name: 'ESI',
    aliases: ['esi', 'express_scripts', 'express scripts'],
    headerPatterns: ['esi', 'express', 'scripts', 'prescription'],
    fieldPatterns: {
      claimantId: ['member_id', 'person_code', 'subscriber_id'],
      claimDate: ['fill_date', 'service_date', 'date_filled'],
      serviceType: ['drug_category', 'therapeutic_class'],
      pharmacyAmount: ['ingredient_cost', 'total_paid', 'plan_paid']
    },
    requiredColumns: ['member_id', 'fill_date', 'total_paid'],
    dateFormats: ['MM/DD/YYYY', 'YYYYMMDD'],
    amountFormats: ['0.00'],
    defaultMapping: {
      claimantId: 'member_id',
      claimDate: 'fill_date',
      serviceType: 'drug_category',
      medicalAmount: 'medical_amount',
      pharmacyAmount: 'total_paid'
    }
  },
  {
    name: 'UnitedHealthcare',
    aliases: ['uhc', 'united', 'unitedhealthcare', 'optum'],
    headerPatterns: ['united', 'uhc', 'optum', 'subscriber'],
    fieldPatterns: {
      claimantId: ['subscriber_id', 'member_id', 'person_id'],
      claimDate: ['service_date', 'claim_date', 'date_of_service'],
      serviceType: ['service_category', 'claim_type'],
      medicalAmount: ['allowed_amount', 'paid_amount', 'benefit_amount'],
      pharmacyAmount: ['rx_amount', 'drug_cost']
    },
    requiredColumns: ['subscriber_id', 'service_date', 'paid_amount'],
    dateFormats: ['MM/DD/YYYY', 'YYYY-MM-DD'],
    amountFormats: ['$0.00', '0.00'],
    defaultMapping: {
      claimantId: 'subscriber_id',
      claimDate: 'service_date',
      serviceType: 'service_category',
      medicalAmount: 'allowed_amount',
      pharmacyAmount: 'rx_amount'
    }
  },
  {
    name: 'Aetna',
    aliases: ['aetna', 'cvs', 'cvs health'],
    headerPatterns: ['aetna', 'cvs', 'member'],
    fieldPatterns: {
      claimantId: ['member_id', 'subscriber_id', 'patient_id'],
      claimDate: ['service_date', 'claim_date'],
      serviceType: ['service_type', 'procedure_category'],
      medicalAmount: ['paid_amount', 'allowed_amount'],
      pharmacyAmount: ['pharmacy_paid', 'drug_cost']
    },
    requiredColumns: ['member_id', 'service_date', 'paid_amount'],
    dateFormats: ['MM/DD/YYYY', 'YYYY-MM-DD'],
    amountFormats: ['$0.00', '0.00'],
    defaultMapping: {
      claimantId: 'member_id',
      claimDate: 'service_date',
      serviceType: 'service_type',
      medicalAmount: 'paid_amount',
      pharmacyAmount: 'pharmacy_paid'
    }
  },
  {
    name: 'Cigna',
    aliases: ['cigna', 'evernorth'],
    headerPatterns: ['cigna', 'evernorth', 'customer'],
    fieldPatterns: {
      claimantId: ['customer_id', 'member_id', 'person_id'],
      claimDate: ['service_date', 'claim_date'],
      serviceType: ['service_category', 'benefit_type'],
      medicalAmount: ['benefit_paid', 'allowed_amount'],
      pharmacyAmount: ['pharmacy_benefit', 'rx_paid']
    },
    requiredColumns: ['customer_id', 'service_date', 'benefit_paid'],
    dateFormats: ['MM/DD/YYYY', 'YYYY-MM-DD'],
    amountFormats: ['0.00'],
    defaultMapping: {
      claimantId: 'customer_id',
      claimDate: 'service_date',
      serviceType: 'service_category',
      medicalAmount: 'benefit_paid',
      pharmacyAmount: 'pharmacy_benefit'
    }
  }
]