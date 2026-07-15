from abc import ABC, abstractmethod
import base64

class SignatureProvider(ABC):
    @abstractmethod
    def sign(self, data: bytes) -> bytes:
        pass

    @abstractmethod
    def verify(self, data: bytes, signature: bytes) -> bool:
        pass

class KeyExchangeProvider(ABC):
    @abstractmethod
    def generate_keypair(self) -> tuple[bytes, bytes]: 
        """Returns (public_key, private_key)"""
        pass

    @abstractmethod
    def encapsulate(self, public_key: bytes) -> tuple[bytes, bytes]: 
        """Returns (ciphertext, shared_secret)"""
        pass
        
    @abstractmethod
    def decapsulate(self, ciphertext: bytes, private_key: bytes) -> bytes: 
        """Returns shared_secret"""
        pass

# Mock Provider for Phase 1 (until liboqs is integrated)
class MockMLDSASignatureProvider(SignatureProvider):
    """
    Mock implementation of ML-DSA (CRYSTALS-Dilithium) FIPS 204.
    Used for Phase 1 stubbing before we install python-oqs.
    """
    def sign(self, data: bytes) -> bytes:
        # In reality this would call the PQC algorithm to generate a signature
        return base64.b64encode(b"MOCK_ML_DSA_SIGNATURE:" + data)

    def verify(self, data: bytes, signature: bytes) -> bool:
        expected = base64.b64encode(b"MOCK_ML_DSA_SIGNATURE:" + data)
        return signature == expected

class MockMLKEMKeyExchangeProvider(KeyExchangeProvider):
    """
    Mock implementation of ML-KEM (CRYSTALS-Kyber) FIPS 203.
    """
    def generate_keypair(self) -> tuple[bytes, bytes]:
        return (b"mock_public_key", b"mock_private_key")

    def encapsulate(self, public_key: bytes) -> tuple[bytes, bytes]:
        return (b"mock_ciphertext", b"mock_shared_secret")
        
    def decapsulate(self, ciphertext: bytes, private_key: bytes) -> bytes:
        return b"mock_shared_secret"
