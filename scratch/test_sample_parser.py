import re
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Test samples from previously unparsed cards
samples = [
    ("Magnadramon", "Spirit", """Flash - [Advent: Cost 5 or more] ((Either Attack Step))
By sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.

[LV1][LV2][LV3] (When Advents)
You can return one opposing Spirit to the Hand."""),

    ("Azulongmon", "Spirit", """Flash - [Advent: Cost 5 or more] ((Either Attack Step))
By sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit.

[LV1][LV2][LV3] (When Advents/Attacks)
Return an opposing Spirit/Ultimate to the bottom of the deck."""),

    ("Birgoyle", "Ultimate", """[Summon Condition: Your Life is at two or more]

[LV3][LV4] (When Summoned)
Destroy an opposing 5000 BP or less Spirit. Or, put a core from the Void to this Ultimate."""),

    ("The WingDragonEmperor Siegfried-Vert", "Spirit", """Flash - [Advent: Cost 6 or more] ((Either Attack Step))
By sending your [Soul Core] to the Trash, stack this card from your Hand onto your target Spirit.

[LV1][LV2][LV3] (When Advents)
Refresh all your "Ancient Dragon" family Spirits."""),

    ("The DestroyerDragonEmperor Siegfried-Rudra", "Spirit", """Flash - [Advent: Cost 5 or more] ((Either Attack Step))
By sending your [Soul Core] to the Trash, stack this from the Hand onto your target Spirit/Ultimate.

[LV1][LV2][LV3] (When Advents)
Send three cores from an opposing Spirit/Ultimate to the Reserve."""),

    ("Angemon", "Spirit", """[LV1][LV2][LV3] (When Attacks)
During this turn, give an opposing Spirit -6000 BP. Or, give an opposing "Ogre Wizard"/"Nightbiker" family Spirit -10000 BP. A Spirit whose BP is brought to 0 by this effect is destroyed.""")
]

print(f"Testing {len(samples)} previously unparsed cards...")
