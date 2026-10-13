"""Local broker authentication; no credentials are written to disk."""
import hmac
import os
from dataclasses import dataclass
from amqtt.plugins.authentication import BaseAuthPlugin

class TokenAuth(BaseAuthPlugin):
    @dataclass
    class Config:
        pass

    async def authenticate(self, *, session):
        expected = os.environ.get('PAKACHI_TOKEN', '')
        return (len(expected) >= 32 and session.username == 'pakachi'
                and isinstance(session.password, str)
                and hmac.compare_digest(session.password.encode(), expected.encode()))
