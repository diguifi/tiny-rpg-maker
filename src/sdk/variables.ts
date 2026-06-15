
/**
 * Variable system for the SDK.
 *
 * The share format addresses up to 16 boolean variables (`var-1` .. `var-16`).
 * Switches, logic gates, variable-doors, LEDs, traps and pressure-plates all
 * reference these by id. The SDK exposes them as {@link VariableRef} handles so
 * authors never have to type raw `var-N` strings.
 */

export const MAX_VARIABLES = 16;

export type VariableRef = {
    /** The encoded variable id, e.g. `'var-1'`. */
    readonly id: string;
    /** 1-based slot index (1..16). */
    readonly index: number;
    /** Optional human-readable label (authoring aid only — not encoded). */
    readonly name?: string;
};

/** Builds the canonical `var-N` id for a 1-based slot index. */
export function variableId(index: number): string {
    if (!Number.isInteger(index) || index < 1 || index > MAX_VARIABLES) {
        throw new Error(`variable index must be an integer in [1, ${MAX_VARIABLES}], got ${index}`);
    }
    return `var-${index}`;
}

/**
 * Normalizes any accepted variable reference to its encoded id.
 * Accepts a {@link VariableRef} or a 1-based slot index (1..16).
 */
export function resolveVariableId(ref: VariableRef | number): string {
    if (typeof ref === 'number') {
        return variableId(ref);
    }
    const id = (ref as { id?: unknown }).id;
    if (typeof id === 'string') {
        return id;
    }
    throw new Error('Expected a VariableRef or a variable index (1..16)');
}
