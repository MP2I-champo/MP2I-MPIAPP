import params from '../../params.json' with { type: 'json' };
type Citation = {
    citation: string;
    author: string;
};

const citations: Citation[] = params.citations;

const citationRegex = new RegExp(citations.map((c) => c.citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

export function containsCitation(message: string): boolean {
    const lower = message.toLowerCase();
    return citations.some((c) => lower.includes(c.citation.toLowerCase()));
}

export function getCitationsInMessage(message: string): Citation[] {
    return citations.filter((citation) => new RegExp(citation.citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(message));
}
