export function createSimpleCredential(issuer: string, subject: string, issuanceDate: string|Date, credentialSubject?: Record<any, any>) {
    if (issuanceDate instanceof Date) issuanceDate.toISOString();
    
    const credential = { 
        credentialSubject: { 
            '@id': subject,
            ...credentialSubject
        }, 
        issuanceDate: issuanceDate as string, 
        issuer 
    };

    return credential;
}