# OzerPan Market

## Product Configuration System

### Dynamic Tabs

The product configuration interface uses a dynamic tab system where tabs are loaded from the API rather than being hardcoded. This makes it easy to add, remove, or modify tabs for different products.

#### How It Works

1. Each product in `products.json` can have a `tabs` array containing objects with:

   - `id`: Unique identifier used for tab selection and content rendering
   - `name`: Display name shown on the tab button
   - `content`: Optional object containing dynamic form field definitions:
     - `fields`: Array of field definitions that will be rendered in the tab

2. The `details-step.tsx` component loads tabs from the selected product and renders them dynamically.

3. When a product is selected, the first available tab is automatically selected.

4. If a tab has content.fields defined, the system automatically renders a dynamic form using these field definitions.

#### Adding a New Tab

To add a new tab to a product:

1. Update the `tabs` array in the product definition in `products.json`:

   ```json
   {
     "id": "new-tab-id",
     "name": "New Tab Name",
     "content": {
       "fields": [
         {
           "id": "fieldId",
           "name": "Field Label",
           "type": "text|number|select|radio|checkbox|color",
           "options": [
             { "id": "option1", "name": "Option 1" },
             { "id": "option2", "name": "Option 2" }
           ],
           "min": 0,
           "max": 100,
           "default": "defaultValue"
         }
       ]
     }
   }
   ```

2. The system will automatically render a dynamic form based on the field definitions.

3. Alternatively, if you need custom behavior, add a new case in the `renderTabContent` function in `details-step.tsx`:

   ```tsx
   case "new-tab-id":
     return (
       <YourTabComponent
         // Add appropriate props here
         onChange={(value) => handleProductDetailsChange("yourProperty", "", value)}
       />
     );
   ```

4. Create a new tab component in `src/app/offers/[offerNo]/add-position/steps/tabs/your-tab-component.tsx` for custom tabs

#### Fallback Behavior

If a product doesn't define any tabs, the system falls back to the default set of tabs. If a tab ID is referenced but doesn't have an implementation, the system displays a loading message.

#### Field Types

The dynamic form system supports the following field types:

1. `text` - A text input field
2. `number` - A number input field with optional min/max validation
3. `select` - A dropdown select with options
4. `radio` - A set of radio buttons for selecting one option
5. `checkbox` - A checkbox toggle
6. `color` - Color swatches for selecting a color

Each field type requires specific properties:

```typescript
interface ProductTabField {
  id: string; // Unique identifier for the field
  name: string; // Display label
  type: "text" | "number" | "select" | "radio" | "checkbox" | "color";
  options?: { id: string; name: string }[]; // Required for select, radio, color
  min?: number; // Optional for number fields
  max?: number; // Optional for number fields
  default?: string | number | boolean; // Default value
}
```
