
import os
import secrets
import logging
from eth_account import Account
from dotenv import load_dotenv

# Load env
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_signer_info():
    # Try to get key from env, otherwise generate ephemeral one
    SIGNER_PRIVATE_KEY = os.getenv("SIGNER_PRIVATE_KEY")
    
    if not SIGNER_PRIVATE_KEY:
        # Generate random key for demo/security
        # Note: In production, this must be persistent in .env
        priv = secrets.token_hex(32)
        SIGNER_PRIVATE_KEY = "0x" + priv
        print(f"EPHEMERAL_KEY={SIGNER_PRIVATE_KEY}")
    else:
        print(f"EXISTING_KEY_FOUND")

    try:
        signer_account = Account.from_key(SIGNER_PRIVATE_KEY)
        SIGNER_ADDRESS = signer_account.address
        print(f"SIGNER_ADDRESS={SIGNER_ADDRESS}")
        return SIGNER_ADDRESS
    except Exception as e:
        print(f"ERROR={e}")
        return None

if __name__ == "__main__":
    get_signer_info()
