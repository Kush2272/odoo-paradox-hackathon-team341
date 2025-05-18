import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

interface AccountTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface AccountTabsProps {
  tabs: AccountTab[];
  defaultTab?: string;
}

export default function AccountTabs({ tabs, defaultTab }: AccountTabsProps) {
  const [location, setLocation] = useLocation();
  
  // Get tab from URL if present
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const tabFromUrl = urlParams.get('tab');
  
  // Determine which tab to show by default
  const activeTab = tabFromUrl || defaultTab || tabs[0].id;
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    // Update URL with the new tab
    const baseUrl = location.split('?')[0];
    const newUrl = `${baseUrl}?tab=${value}`;
    setLocation(newUrl);
  };
  
  return (
    <Tabs 
      defaultValue={activeTab} 
      className="w-full"
      onValueChange={handleTabChange}
    >
      <TabsList className="flex border-b w-full rounded-none justify-start">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id} 
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#4CAF50] data-[state=active]:text-[#4CAF50]"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="p-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
