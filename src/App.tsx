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

export default function App() {
  const [domElement, setDomElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const sidebar = (
    <Sidebar>
      <SidebarBody>
        <SidebarSection>
          <SidebarHeading>
            <div className={cn('flex', 'flex-row', 'flex-nowrap')}>
              <span className={cn('font-semibold', 'text-zinc-900')}>
                React Two.js
              </span>{' '}
              <Badge className={cn('ml-auto')} color="blue">
                v0.2.2
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

        <SidebarSection></SidebarSection>
      </SidebarBody>
    </Sidebar>
  );

  useEffect(() => {
    if (!domElement) return;

    const updateSize = () => {
      const rect = domElement.getBoundingClientRect();
      setWidth(rect.width);
      setHeight(rect.height);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [domElement]);

  return (
    <SidebarLayout ref={setDomElement} navbar={null} sidebar={sidebar}>
      <Playground width={width} height={height} />
    </SidebarLayout>
  );
}
