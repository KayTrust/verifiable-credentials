

export class UnsupportedAlgorithmJwt extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = UnsupportedAlgorithmJwt.name;
    }
}

export class InvalidIat extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidIat.name;
    }
}

export class InvalidExp extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidExp.name;
    }
}


export class InvalidMnid extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidMnid.name;
    }
}

export class ContractAddressRequired extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = ContractAddressRequired.name;
    }
}

export class InsufficientBalance extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InsufficientBalance.name;
    }
}

export class CantEstimatedGas extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = CantEstimatedGas.name;
    }
}

export class InvalidPrivateKey extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidPrivateKey.name;
    }
}

export class InvalidPublicKey extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidPublicKey.name;
    }
}

export class IdentityNotRegistered extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = IdentityNotRegistered.name;
    }
}

export class CapabilityRequired extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = CapabilityRequired.name;
    }
}

export class UnsupportedProofTypeError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = UnsupportedProofTypeError.name;
    }
}

export class NotAccreditedError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = NotAccreditedError.name;
    }
}

export declare class IssuerOrHolderRequiredError extends Error {
    constructor(message?: string);
}

export class CredentialRequired extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = CredentialRequired.name;
    }
}

export class InvalidCredentials extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = InvalidCredentials.name;
    }
}