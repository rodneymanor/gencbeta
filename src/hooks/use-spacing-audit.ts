import { useCallback } from "react";

export interface SpacingAuditResult {
  element: HTMLElement;
  className: string;
  issues: string[];
}

export const useSpacingAudit = () => {
  const audit = useCallback((element: HTMLElement): SpacingAuditResult[] => {
    const results: SpacingAuditResult[] = [];
    
    // Find all elements with spacing classes
    const elementsWithSpacing = Array.from(
      element.querySelectorAll("[class*='gap-'],[class*='p-'],[class*='m-'],[class*='space-']")
    ) as HTMLElement[];
    
    elementsWithSpacing.forEach((el) => {
      const className = el.className;
      const issues: string[] = [];
      
      // Check for non-4px multiples in gap classes
      const gapMatches = className.match(/gap-(\d+)/g);
      if (gapMatches) {
        gapMatches.forEach((match) => {
          const value = parseInt(match.split('-')[1]);
          // Allow 0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64 (4px multiples)
          const allowedValues = [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64];
          if (!allowedValues.includes(value)) {
            issues.push(`Gap value ${value} is not a 4px multiple`);
          }
        });
      }
      
      // Check for non-4px multiples in padding classes
      const paddingMatches = className.match(/p[xytrbl]?-(\d+)/g);
      if (paddingMatches) {
        paddingMatches.forEach((match) => {
          const value = parseInt(match.split('-')[1]);
          const allowedValues = [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64];
          if (!allowedValues.includes(value)) {
            issues.push(`Padding value ${value} is not a 4px multiple`);
          }
        });
      }
      
      // Check for non-4px multiples in margin classes
      const marginMatches = className.match(/m[xytrbl]?-(\d+)/g);
      if (marginMatches) {
        marginMatches.forEach((match) => {
          const value = parseInt(match.split('-')[1]);
          const allowedValues = [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64];
          if (!allowedValues.includes(value)) {
            issues.push(`Margin value ${value} is not a 4px multiple`);
          }
        });
      }
      
      // Check for non-4px multiples in space classes
      const spaceMatches = className.match(/space-[xy]-(\d+)/g);
      if (spaceMatches) {
        spaceMatches.forEach((match) => {
          const value = parseInt(match.split('-')[2]);
          const allowedValues = [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64];
          if (!allowedValues.includes(value)) {
            issues.push(`Space value ${value} is not a 4px multiple`);
          }
        });
      }
      
      if (issues.length > 0) {
        results.push({
          element: el,
          className,
          issues
        });
      }
    });
    
    return results;
  }, []);
  
  const auditPage = useCallback(() => {
    const results = audit(document.body);
    
    if (results.length > 0) {
      console.group("🔍 Spacing Audit Results");
      results.forEach(({ element, className, issues }) => {
        console.warn("Element:", element);
        console.warn("Classes:", className);
        console.warn("Issues:", issues);
        console.log("---");
      });
      console.groupEnd();
    } else {
      console.log("✅ No spacing issues found!");
    }
    
    return results;
  }, [audit]);
  
  const auditComponent = useCallback((ref: React.RefObject<HTMLElement>) => {
    if (!ref.current) return [];
    return audit(ref.current);
  }, [audit]);
  
  return { 
    audit, 
    auditPage, 
    auditComponent 
  };
}; 