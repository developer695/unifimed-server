import { z } from 'zod';

export const generateSignedUrlSchema = z.object({
    filename: z.string().min(1, 'Filename is required'),
    category: z.enum(['contact_enrichment_pdf', 'keyword_research_pdf', 'rules_upload_pdf']),
    userId: z.string().uuid('Valid user ID is required'),
    userEmail: z.string().email('Valid email is required'),
    action: z.enum(['clear', 'update']).optional(), // Fix: use array of valid values
});

export const saveFileRecordSchema = z.object({
    userId: z.string().uuid('Valid user ID is required'),
    category: z.enum(['contact_enrichment_pdf', 'keyword_research_pdf', 'rules_upload_pdf']),
    original_filename: z.string().min(1, 'Original filename is required'),
    cloudinary_url: z.string().url('Valid Cloudinary URL is required'),
    cloudinary_public_id: z.string().min(1, 'Cloudinary public ID is required'),
    file_size: z.number().min(1, 'File size must be greater than 0').optional(),
});