import params from '../../params.json' with { type: 'json' };
type Citation = {
    citation: string;
    author: string;
};

const citations: Citation[] = params.citations;

const citationRegex = new RegExp(citations.map((c) => c.citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

export function containsCitation(message: string): boolean {
    return citationRegex.test(message);
}

export function getCitationsInMessage(message: string): Citation[] {
    return citations.filter((citation) => new RegExp(citation.citation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(message));
}
