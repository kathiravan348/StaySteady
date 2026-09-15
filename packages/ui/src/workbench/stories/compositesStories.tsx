import { useState, type ReactElement } from 'react';
import { Accordion } from '../../composites/Accordion/Accordion';
import { CommandPalette } from '../../composites/CommandPalette/CommandPalette';
import { Drawer } from '../../composites/Drawer/Drawer';
import { DropdownMenu } from '../../composites/DropdownMenu/DropdownMenu';
import { FormField } from '../../composites/FormField/FormField';
import { Modal } from '../../composites/Modal/Modal';
import { Popover } from '../../composites/Popover/Popover';
import { Tabs } from '../../composites/Tabs/Tabs';
import { ToastContainer, type ToastItem } from '../../composites/Toast/Toast';
import { Button } from '../../primitives/Button/Button';
import { Input } from '../../primitives/Input/Input';
import type { ComponentStory } from '../types';

function ModalDemo(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        Open Confirmation Modal
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Approve Buy Order"
        footer={
          <>
            <Button variant="ghost" size="sm" onPress={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onPress={() => setIsOpen(false)}>
              Confirm Order
            </Button>
          </>
        }
      >
        Are you sure you want to approve the limit order for 50 shares of AAPL at $182.50?
      </Modal>
    </div>
  );
}

function DrawerDemo(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        Open Position Detail Drawer
      </Button>
      <Drawer
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Position Detail: AAPL"
        placement="right"
      >
        <p>Purchased 4 lots across 2022-2024. Total unrealized gain: +$14,280.50 (+38.4%).</p>
      </Drawer>
    </div>
  );
}

function ToastDemo(): ReactElement {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([
    { id: '1', title: 'Order Filled', description: 'Bought 10 AAPL @ $185.20', variant: 'success' },
  ]);
  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        onPress={() =>
          setToasts((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              title: 'Price Alert',
              description: 'TSLA crossed $240.00',
              variant: 'warning',
            },
          ])
        }
      >
        Trigger Alert Toast
      </Button>
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />
    </div>
  );
}

function CommandDemo(): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" onPress={() => setIsOpen(true)}>
        Open Command Palette (Cmd+K)
      </Button>
      <CommandPalette
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        items={[
          { id: '1', label: 'Go to Overview', category: 'Navigation', onSelect: () => {} },
          { id: '2', label: 'Go to Holdings', category: 'Navigation', onSelect: () => {} },
          { id: '3', label: 'Toggle Simulation Mode', category: 'System', onSelect: () => {} },
          { id: '4', label: 'Halt All Automation', category: 'Safety', onSelect: () => {} },
        ]}
      />
    </div>
  );
}

export const compositesStories: readonly ComponentStory[] = [
  {
    id: 'form-field',
    name: 'FormField',
    category: 'Composites',
    description:
      'Accessible form wrapper with label, required indicator, helper text, and error alert.',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 360 }}>
        <FormField label="Strategy Name" isRequired hint="Identifying name for this model">
          <Input placeholder="e.g. Momentum Breakout US" />
        </FormField>
        <FormField
          label="Max Drawdown (%)"
          isRequired
          error="Must be a positive percentage under 50%"
        >
          <Input defaultValue="-5" />
        </FormField>
      </div>
    ),
  },
  {
    id: 'dropdown-menu',
    name: 'DropdownMenu',
    category: 'Composites',
    description: 'Keyboard-accessible menu with items, shortcuts, danger actions, and separators.',
    render: () => (
      <DropdownMenu
        trigger={<Button variant="secondary">Actions ▾</Button>}
        items={[
          { id: 'edit', label: 'Edit Strategy', shortcut: '⌘E' },
          { id: 'clone', label: 'Duplicate Model' },
          { id: 'sep1', label: '', isSeparator: true },
          { id: 'archive', label: 'Archive Model', isDanger: true },
        ]}
      />
    ),
  },
  {
    id: 'modal',
    name: 'Modal',
    category: 'Composites',
    description: 'Dialog overlay with acrylic backdrop blur, focus trap, and escape dismissal.',
    render: () => <ModalDemo />,
  },
  {
    id: 'drawer',
    name: 'Drawer',
    category: 'Composites',
    description: 'Slide-in side drawer supporting left, right, and bottom placements.',
    render: () => <DrawerDemo />,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Composites',
    description: 'Tab navigation strip with animated active border and panel switching.',
    render: () => (
      <div style={{ maxWidth: 500 }}>
        <Tabs
          items={[
            {
              id: 'overview',
              label: 'Overview',
              content: <div>Portfolio performance statistics</div>,
            },
            {
              id: 'lots',
              label: 'Purchase Lots',
              content: <div>Tax lot breakdowns and acquisition dates</div>,
            },
            {
              id: 'orders',
              label: 'Orders',
              content: <div>Active and filled transaction logs</div>,
            },
          ]}
        />
      </div>
    ),
  },
  {
    id: 'accordion',
    name: 'Accordion',
    category: 'Composites',
    description: 'Collapsible accordion panels supporting single or multiple open sections.',
    render: () => (
      <div style={{ maxWidth: 500 }}>
        <Accordion
          defaultExpandedIds={['limits']}
          items={[
            {
              id: 'limits',
              title: 'Risk Limits & Thresholds',
              content: <div>Daily loss limit: $5,000</div>,
            },
            {
              id: 'markets',
              title: 'Authorized Markets',
              content: <div>Brokers: Interactive Brokers, Zerodha</div>,
            },
          ]}
        />
      </div>
    ),
  },
  {
    id: 'toast',
    name: 'Toast',
    category: 'Composites',
    description:
      'Floating notification alerts across success, warning, error, and info severities.',
    render: () => <ToastDemo />,
  },
  {
    id: 'popover',
    name: 'Popover',
    category: 'Composites',
    description: 'Contextual popover dialog anchored to a trigger button.',
    render: () => (
      <Popover
        trigger={
          <Button variant="outline" size="sm">
            Filter by Sector
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 180 }}>
          <label>
            <input type="checkbox" defaultChecked /> Technology
          </label>
          <label>
            <input type="checkbox" defaultChecked /> Financials
          </label>
          <label>
            <input type="checkbox" /> Healthcare
          </label>
        </div>
      </Popover>
    ),
  },
  {
    id: 'command-palette',
    name: 'CommandPalette',
    category: 'Composites',
    description: 'Keyboard-driven modal search palette for instant navigation.',
    render: () => <CommandDemo />,
  },
];
