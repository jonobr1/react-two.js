import { SidebarLayout } from '@/components/catalyst/SidebarLayout';
import {
  Sidebar,
  SidebarBody,
  SidebarDivider,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from '@/components/catalyst/sidebar';
import { Text } from '@/components/catalyst/Text';
import { Badge } from '@/components/catalyst/Badge';
import { Marquee } from '@/components/common/Marquee';
import {
  CursorArrowRaysIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid';
import cn from 'clsx';
import InteractiveCanvas from '@/components/Canvas';
import { version } from '../package.json';

export default function App() {
  const sidebar = (
    <Sidebar>
      <SidebarBody>
        <SidebarSection>
          <SidebarHeading>
            <div className={cn('flex', 'flex-row', 'flex-nowrap')}>
              <span
                className={cn(
                  'font-semibold',
                  'text-zinc-900',
                  'dark:text-zinc-300'
                )}
              >
                React Two.js
              </span>{' '}
              <Badge className={cn('ml-auto')} color="blue">
                {version}
              </Badge>
            </div>
          </SidebarHeading>
          <SidebarLabel>
            <Text className={cn('px-2')}>
              <Marquee>
                <span className={cn('mr-2')}>
                  Declarative 2D graphics for the web and beyond
                </span>
              </Marquee>
            </Text>
          </SidebarLabel>
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection>
          <SidebarItem href="https://github.com/jonobr1/react-two.js">
            <CodeBracketIcon /> <SidebarLabel>Github</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="https://npmjs.com/package/react-two.js">
            <CommandLineIcon /> <SidebarLabel>Package</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="https://github.com/sponsors/jonobr1">
            <CurrencyDollarIcon /> <SidebarLabel>Sponsor</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="https://chatgpt.com/g/g-hkcTX8uPm-two-js-tutor">
            <SparklesIcon />
            <SidebarLabel>ChatGPT</SidebarLabel>
          </SidebarItem>
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection>
          <SidebarHeading>Example</SidebarHeading>
          <SidebarLabel>
            <Text className={cn('px-2')}>
              An infinite canvas example built on the local `lib/` renderer.
            </Text>
          </SidebarLabel>
          <SidebarItem href="#canvas-example">
            <CursorArrowRaysIcon />
            <SidebarLabel>Interactive Canvas</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  );

  return (
    <SidebarLayout navbar={null} sidebar={sidebar}>
      <section id="canvas-example" className={cn('h-full', 'min-h-[calc(100vh-2rem)]')}>
        <InteractiveCanvas />
      </section>
    </SidebarLayout>
  );
}
