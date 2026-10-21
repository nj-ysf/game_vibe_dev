import re
from pydantic import BaseModel, ConfigDict, Field, StrictInt, field_validator


def normalize_phone(value: str) -> str:
    value = re.sub(r'[\s().-]', '', value)
    if value.startswith('+212'):
        value = '0' + value[4:]
    elif value.startswith('00212'):
        value = '0' + value[5:]
    if not re.fullmatch(r'0[67][0-9]{8}', value):
        raise ValueError('Enter a Moroccan mobile number starting with 06 or 07 (or +212).')
    return value


class Hit(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: StrictInt = Field(ge=0)
    at: StrictInt = Field(ge=0, lt=45000)


class ScoreSubmission(BaseModel):
    model_config = ConfigDict(extra='forbid')
    session_id: str = Field(min_length=20, max_length=100)
    name: str = Field(min_length=2, max_length=80)
    filiere: str = Field(min_length=2, max_length=40)
    phone_number: str = Field(max_length=30)
    score: StrictInt = Field(ge=0, le=30000)
    hits: list[Hit] = Field(default_factory=list, max_length=300)

    @field_validator('name', 'filiere')
    @classmethod
    def clean_text(cls, value):
        value = ' '.join(value.split())
        if len(value) < 2 or any(ord(c) < 32 for c in value):
            raise ValueError('Please enter at least two printable characters.')
        return value

    @field_validator('phone_number')
    @classmethod
    def phone(cls, value):
        return normalize_phone(value)
