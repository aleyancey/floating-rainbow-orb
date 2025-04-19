# models/sound_asset.py

import logging
import uuid
from enum import Enum
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, UUID4, field_validator # Keep UUID4 if you prefer, or change to uuid.UUID
import uuid # Make sure uuid is imported

# --- NEW SQLAlchemy Imports ---
from sqlalchemy import Column, String, Integer, Boolean, Float, JSON # Core column types
from sqlalchemy.dialects.postgresql import UUID as PG_UUID # Example if using Postgres UUID type later
from sqlalchemy import TypeDecorator # For handling UUID consistently
from core.database import Base # Import the Base class we defined
# --- End NEW SQLAlchemy Imports ---

# Define an Enum for the different types of sound sources (Integrated from proposal)
class SourceType(str, Enum):
    NATURAL = "Natural"         # Recorded sounds from nature
    CONCRETE = "Concrete"       # Recorded sounds from man-made environments/objects
    SYNTH = "Synth"             # Electronically generated waveforms/tones
    MUSIC = "Music"             # Melodic or harmonic musical elements
    # Add more types if needed

class SoundAsset(BaseModel):
    """
    Represents a single sound asset (e.g., an audio file)
    managed by the application. Embodies metadata crucial for the
    Generative Logic Engine and Asset Manager.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Unique identifier (UUID) for the sound asset.") # Changed type hint to uuid.UUID for consistency
    name: str = Field(..., min_length=1, description="Human-readable name for the sound (e.g., 'Heavy Rain', 'Distant Thunder'). Cannot be empty.")
    source_type: SourceType = Field(..., description="The high-level category or origin of the sound.") # Added from proposal
    file_path: Path = Field(..., description="Path to the sound file, relative to a defined asset base directory.")
    duration_ms: int = Field(..., gt=0, description="Duration of the sound asset in milliseconds. Must be positive.") # Added from proposal, made required
    description: Optional[str] = Field(None, description="Optional longer description of the sound's character or source.")
    tags: List[str] = Field(default_factory=list, description="List of descriptive tags for categorization and retrieval (e.g., ['rain', 'weather', 'loopable', 'nature', 'low_frequency']). Processed to be unique, lowercase, sorted.")
    loopable: bool = Field(default=False, description="Indicates if the sound is designed or marked as suitable for seamless looping.")
    default_volume: float = Field(default=1.0, ge=0.0, le=1.0, description="Default relative playback volume factor (0.0 to 1.0). Used as a baseline by the Generative Engine.")
    # Optional fields you might add later:
    # channels: Optional[int] = None # 1 for mono, 2 for stereo
    # sample_rate: Optional[int] = None # e.g., 44100, 48000
    # bit_depth: Optional[int] = None
    # attribution: Optional[str] = None # Source/license info

    # --- Validators ---

    @field_validator('tags', mode='before')
    def process_tags(cls, v: Optional[List[str]]) -> List[str]:
        """
        Ensures tags are stored as unique, lowercase, non-empty strings
        without leading/trailing whitespace, sorted alphabetically.
        """
        if v is None:
            return []
        processed_tags = set()
        for tag in v:
            if isinstance(tag, str):
                cleaned_tag = tag.strip().lower()
                if cleaned_tag: # Ensure tag is not empty after stripping
                    processed_tags.add(cleaned_tag)
            # Optional: Add logging for non-string tags if desired
            # else:
            #     logging.warning(f"Non-string value encountered in tags list: {tag}")
        return sorted(list(processed_tags))

    # --- Pydantic Configuration ---
    class Config:
        """Pydantic model configuration."""
        validate_assignment = True
        from_attributes = True  # Re-validate fields if they are assigned new values after instantiation
        # orm_mode = True # Enable if you plan to use this with an ORM like SQLAlchemy later

        # Add example for OpenAPI docs (Using Pydantic V2 style)
        json_schema_extra = {
            "example": {
                "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
                "name": "Gentle Stream Loop",
                "source_type": "natural",
                "file_path": "natural/streams/gentle_stream_loop_01.wav",
                "duration_ms": 45000, # 45 seconds
                "description": "A seamlessly loopable recording of a small, clear stream flowing over pebbles.",
                "tags": ["background", "gentle", "loopable", "nature", "pebbles", "stream", "water"],
                "loopable": True,
                "default_volume": 0.85
            }
        }
        # If using Pydantic V1, use schema_extra = { ... example json ... }

# --- SQLAlchemy ORM Model ---

# Custom Type Decorator for UUID to ensure consistent handling
# This helps bridge potential differences between DB driver implementations
class GUID(TypeDecorator):
    """Platform-independent GUID type."""
    impl = String(36) # Store as CHAR(36) or similar fixed-length string
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif isinstance(value, uuid.UUID):
            return str(value) # Store as string
        else:
            # Attempt to convert if not already UUID or None
            try:
                return str(uuid.UUID(value))
            except (TypeError, ValueError):
                raise ValueError(f"Invalid UUID value: {value}")

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            try:
                return uuid.UUID(value) # Convert back to UUID object
            except (TypeError, ValueError):
                 # Handle cases where the stored value isn't a valid UUID string
                logging.error(f"Failed to convert database value '{value}' to UUID.")
                return None # Or raise an error, depending on desired strictness


class SoundAssetORM(Base):
    """
    SQLAlchemy ORM model representing the 'sound_assets' table.
    """
    __tablename__ = "sound_assets"

    # Columns definition
    id: uuid.UUID = Column(GUID, primary_key=True, default=uuid.uuid4)
    name: str = Column(String(150), nullable=False, index=True) # Added length limit
    source_type: str = Column(String(50), nullable=False) # Store Enum value as string
    file_path: str = Column(String(512), nullable=False) # Store Path as string, increased length
    duration_ms: Optional[int] = Column(Integer, nullable=True)  # Allow NULLs
    description: Optional[str] = Column(String(1024), nullable=True) # Increased length
    # Use JSON type for the list of strings. Ensure your SQLite version supports it (most modern ones do).
    # Alternatively, use a simple String and handle serialization/deserialization manually.
    tags: Optional[List[str]] = Column(JSON, nullable=True, default=list)
    loopable: bool = Column(Boolean, default=False, nullable=False)
    default_volume: float = Column(Float, default=1.0, nullable=False)
    metadata_: Optional[Dict[str, Any]] = Column(JSON, nullable=True)  # Store additional metadata as JSON

    def __repr__(self):
        return f"<SoundAssetORM(id={self.id}, name='{self.name}', path='{self.file_path}')>"

# --- End SQLAlchemy ORM Model ---


# Keep your if __name__ == "__main__": block here (optional)
# if __name__ == "__main__":
#    # ... your Pydantic model tests ...

# --- Example Usage (Updated for new fields) ---
if __name__ == "__main__":
    print("--- Testing SoundAsset Model (Merged) ---")

    # Example 1: Valid asset
    try:
        asset1_data = {
            "name": "Forest Birds Ambience",
            "source_type": SourceType.NATURAL, # Or "natural"
            "file_path": Path("natural/forest_morning_birds.wav"),
            "duration_ms": 125300, # Example duration
            "description": "Gentle bird calls recorded in a mixed deciduous forest at dawn.",
            "tags": ["Nature", "Birds", "Forest", "Morning ", " Ambience", "Nature"], # Test cleanup
            "loopable": False,
            "default_volume": 0.75
        }
        asset1 = SoundAsset(**asset1_data)
        print("\nAsset 1 Created Successfully:")
        # Use model_dump_json for Pydantic v2, or .json() for v1
        try:
            print(asset1.model_dump_json(indent=2))
        except AttributeError:
            print(asset1.json(indent=2)) # Fallback for Pydantic v1
        print(f"Asset 1 ID: {asset1.id}")
        print(f"Asset 1 Tags (Processed): {asset1.tags}")
        print(f"Asset 1 Source Type: {asset1.source_type.value}")

    except Exception as e:
        print(f"\nError creating Asset 1: {e}")

    # Example 2: Minimal asset
    try:
        asset2 = SoundAsset(
            name="Sine Drone C3",
            source_type="synth", # Can use string value
            file_path=Path("synth/sine_drone_c3_loop.ogg"),
            duration_ms=60000,
            loopable=True,
            tags=['synth', 'drone', 'loopable', 'harmonic']
        )
        print("\nAsset 2 Created Successfully:")
        try:
            print(asset2.model_dump_json(indent=2))
        except AttributeError:
            print(asset2.json(indent=2))
    except Exception as e:
        print(f"\nError creating Asset 2: {e}")

    # Example 3: Testing Validation Failure (Duration <= 0)
    try:
        invalid_data = {
            "name": "Zero Duration",
            "source_type": "concrete",
            "file_path": Path("test/short.mp3"),
            "duration_ms": 0 # Invalid duration
        }
        SoundAsset(**invalid_data)
        print("\nError: Asset 3 (Invalid Duration) should have failed validation but didn't.")
    except Exception as e: # Expecting Pydantic's ValidationError
        print(f"\nSuccessfully caught expected validation error for Asset 3: {e}")

    # Test other examples if needed (volume, tags etc.) - your original tests were good

    print("\n--- End of SoundAsset Model Tests ---")