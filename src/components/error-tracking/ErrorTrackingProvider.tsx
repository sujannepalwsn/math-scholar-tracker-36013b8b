import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { logger } from "@/utils/logger";

interface ErrorContext {
  moduleName?: string;
  componentName?: string;
}

const ErrorTrackingContext = createContext<ErrorContext>({
  moduleName: 'Global',
  componentName: 'Root',
});

export const useErrorContext = () => useContext(ErrorTrackingContext);

interface ErrorTrackingProviderProps {
  moduleName: string;
  componentName?: string;
  children: React.ReactNode;
}

export const ErrorTrackingProvider: React.FC<ErrorTrackingProviderProps> = ({
  moduleName,
  componentName,
  children,
}) => {
  const parentContext = useErrorContext();

  const contextValue = useMemo(() => ({
    moduleName: moduleName || parentContext.moduleName,
    componentName: componentName || parentContext.componentName,
  }), [moduleName, componentName, parentContext]);

  useEffect(() => {
    // Sync React context with the Singleton Logger whenever it changes
    logger.setContext({
      module: contextValue.moduleName,
      component: contextValue.componentName
    });
  }, [contextValue]);

  return (
    <ErrorTrackingContext.Provider value={contextValue}>
      {children}
    </ErrorTrackingContext.Provider>
  );
};
