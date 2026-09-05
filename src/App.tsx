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
  CodeBracketIcon,
  CommandLineIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/20/solid';
import cn from 'clsx';
import Playground from './Playground';
import { useEffect, useState } from 'react';
import { version } from '../package.json';
import { PLAYGROUNDS } from './playgrounds/registry';

export default function App() {
  const [domElement, setDomElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [activePlaygroundId, setActivePlaygroundId] = useState('wiremarks');

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
                  'dark:text-zinc-300',
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
          <SidebarHeading>Playgrounds</SidebarHeading>
          {PLAYGROUNDS.map((playground) => {
            const Icon = playground.icon;
            const isCurrent = activePlaygroundId === playground.id;

            return (
              <SidebarItem
                key={playground.id}
                current={isCurrent}
                onClick={() => setActivePlaygroundId(playground.id)}
              >
                <Icon data-slot="icon" />
                <SidebarLabel>{playground.name}</SidebarLabel>
              </SidebarItem>
            );
          })}
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection>
          <SidebarItem href="https://github.com/jonobr1/react-two.js">
            <CodeBracketIcon data-slot="icon" />{' '}
            <SidebarLabel>GitHub</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="https://npmjs.com/package/react-two.js">
            <CommandLineIcon data-slot="icon" />{' '}
            <SidebarLabel>Package</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="https://github.com/sponsors/jonobr1">
            <CurrencyDollarIcon data-slot="icon" />{' '}
            <SidebarLabel>Sponsor</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="https://chatgpt.com/g/g-hkcTX8uPm-two-js-tutor">
            <SparklesIcon data-slot="icon" />
            <SidebarLabel>ChatGPT</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  );

  useEffect(() => {
    if (!domElement) return;

    const measure = () => {
      const rect = domElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setWidth(Math.floor(rect.width));
        setHeight(Math.floor(rect.height));
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setWidth(Math.floor(width));
            setHeight(Math.floor(height));
          }
        }
      });

      observer.observe(domElement);

      return () => {
        observer.disconnect();
      };
    } else {
      window.addEventListener('resize', measure);
      return () => {
        window.removeEventListener('resize', measure);
      };
    }
  }, [domElement]);

  return (
    <SidebarLayout ref={setDomElement} navbar={null} sidebar={sidebar}>
      <Playground
        width={width}
        height={height}
        activePlaygroundId={activePlaygroundId}
      />
    </SidebarLayout>
  );
}
