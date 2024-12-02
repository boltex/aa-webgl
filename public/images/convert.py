from PIL import Image

# Load the sprite sheet image
sprite_sheet = Image.open('alien.png')  # 4096x4096 pixels

# Set sprite dimensions
sprite_width = 64
sprite_height = 64

# Create the output image
total_sprites = (sprite_sheet.width // sprite_width) * (sprite_sheet.height // sprite_height)
output_image = Image.new('RGBA', (sprite_width, total_sprites * sprite_height))

# Rearrange sprites vertically
sprite_index = 0

# Outside loops for 4x4 subsheets
for sheet_x in range(4):
    for sheet_y in range(4):

        # Inside loops for individual sprites
        for y in range(0, 1024, sprite_height):
            for x in range(0, 1024, sprite_width):
                left = x + (sheet_x * 1024)
                upper = y + (sheet_y * 1024)
                right = left + sprite_width
                lower = upper + sprite_height

                # Crop the sprite from the sprite sheet
                sprite = sprite_sheet.crop((left, upper, right, lower))
                
                # Calculate the vertical position in the output image
                target_y = sprite_index * sprite_height
                
                # Paste the sprite into the output image
                output_image.paste(sprite, (0, target_y))
                sprite_index += 1

# Save the output image
output_image.save('rearranged-spritesheet2.png')