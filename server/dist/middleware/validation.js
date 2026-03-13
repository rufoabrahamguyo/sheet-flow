import { z } from 'zod';
export function validateChatBody(req, res, next) {
    const schema = z.object({
        messages: z.array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string().min(1).max(20_000),
        })),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Invalid chat payload' });
        return;
    }
    next();
}
export function validateDocumentId(req, res, next) {
    const id = req.params.id;
    if (!id || typeof id !== 'string' || id.length > 200) {
        res.status(400).json({ message: 'Invalid document id' });
        return;
    }
    next();
}
export function validatePutDocumentBody(req, res, next) {
    const schema = z.object({
        document: z.object({
            id: z.string().min(1).max(200),
            name: z.string().max(200).optional(),
            activeSheetId: z.string().min(1).max(200),
            sheets: z.array(z.object({
                id: z.string().min(1).max(200),
                name: z.string().min(1).max(200),
                cells: z.record(z.object({
                    value: z.string().max(50_000),
                    raw: z.string().max(50_000).optional(),
                    format: z
                        .object({
                        bold: z.boolean().optional(),
                        italic: z.boolean().optional(),
                    })
                        .optional(),
                })),
            })),
        }),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Invalid document payload' });
        return;
    }
    next();
}
