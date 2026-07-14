import { Search } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@ui/input-group';

export const SidebarSearch = () => {
  return (
    <InputGroup className="mt-1 shadow-lg">
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
};
