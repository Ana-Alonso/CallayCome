import { Check } from 'lucide-react';
import { ShoppingItemContainer, ShoppingCheckbox, ShoppingItemName, ShoppingItemQty } from '../common';
import type { ShoppingItem } from '../../types';

interface ShoppingItemCardProps {
  item: ShoppingItem;
  on_toggle: () => void;
}

export const ShoppingItemCard = ({
  item,
  on_toggle
}: ShoppingItemCardProps) => {
  return (
    <ShoppingItemContainer 
      className={item.purchased ? 'purchased' : ''}
      onClick={on_toggle}
    >
      <ShoppingCheckbox checked={item.purchased}>
        <Check />
      </ShoppingCheckbox>
      <ShoppingItemName>{item.ingredient_name}</ShoppingItemName>
      <ShoppingItemQty>comprar {item.quantity} {item.unit}</ShoppingItemQty>
    </ShoppingItemContainer>
  );
};
