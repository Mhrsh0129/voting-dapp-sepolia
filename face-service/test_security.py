
import sys
import os
import unittest
import numpy as np
import logging

# Ensure we can import modules from current directory
sys.path.append(os.getcwd())

# Load env variables (CRITICAL for keys)
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# Import models after loading env might help, but function-level access is safest
from models import Base, User
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import to_bytes, keccak

class TestFaceServiceSecurity(unittest.TestCase):
    def setUp(self):
        # In-memory DB for test isolation
        self.engine = create_engine('sqlite:///:memory:')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

    def test_01_keys_exist(self):
        """Check if .env is properly populated"""
        print("\n[1] Checking Environment Keys...")
        signer_key = os.getenv("SIGNER_PRIVATE_KEY")
        db_key = os.getenv("DB_ENCRYPTION_KEY")
        
        self.assertIsNotNone(signer_key, "❌ SIGNER_PRIVATE_KEY missing")
        self.assertNotEqual(signer_key, "", "❌ SIGNER_PRIVATE_KEY empty")
        print(f"   ✅ Signer Key found: {signer_key[:6]}...")
        
        self.assertIsNotNone(db_key, "❌ DB_ENCRYPTION_KEY missing")
        self.assertNotEqual(db_key, "", "❌ DB_ENCRYPTION_KEY empty")
        print(f"   ✅ DB Key found: {db_key[:6]}...")

    def test_02_database_encryption(self):
        """Verify embeddings are encrypted at rest"""
        print("\n[2] Testing Database Encryption...")
        user_id = "test_user_v2"
        # Generate random 128-float embedding
        original_embedding = np.random.rand(128).astype(np.float32)
        
        user = User(id=user_id)
        user.set_embedding(original_embedding)
        
        self.session.add(user)
        self.session.commit()
        
        # Verify stored data is not the raw bytes (basic check)
        raw_bytes = original_embedding.tobytes()
        self.assertNotEqual(user.embedding, raw_bytes, "❌ Data stored as raw bytes (Not Encrypted!)")
        print("   ✅ Data stored on disk is different from raw bytes (Encrypted)")

        # Verify decryption works
        fetched_user = self.session.query(User).filter_by(id=user_id).first()
        decrypted_embedding = fetched_user.get_embedding()
        
        self.assertTrue(np.allclose(original_embedding, decrypted_embedding), "❌ Decrypted data does not match original")
        print("   ✅ Decryption successful - Integrity preserved")

    def test_03_signature_generation(self):
        """Verify 123-signed message generation logic"""
        print("\n[3] Testing Crypto Signing Logic...")
        key = os.getenv("SIGNER_PRIVATE_KEY")
        account = Account.from_key(key)
        print(f"   ℹ️  Signer Address: {account.address}")
        
        # Simulated User Address (Frontend wallet)
        user_address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
        
        # Hash Logic (Must match Solidity)
        # Solidity: keccak256(abi.encodePacked(msg.sender))
        addr_bytes = to_bytes(hexstr=user_address)
        msg_hash = keccak(addr_bytes)
        
        # Sign (EIP-191)
        # Fix: encode_defunct takes 'primitive' for raw bytes not 'digest'
        signable_message = encode_defunct(primitive=msg_hash)
        signed_message = account.sign_message(signable_message)
        signature = "0x" + signed_message.signature.hex()
        
        self.assertTrue(signature.startswith("0x"), "❌ Signature missing 0x prefix")
        self.assertEqual(len(signature), 132, "❌ Invalid signature length")
        print(f"   ✅ Signature generated: {signature[:10]}...")

if __name__ == '__main__':
    unittest.main()
