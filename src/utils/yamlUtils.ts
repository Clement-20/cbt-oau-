import yaml from 'js-yaml';

/**
 * Utility for parsing and stringifying YAML data.
 * Useful for academic resources, question banks, or configurations.
 */
export const yamlUtils = {
  /**
   * Parse a YAML string into a JavaScript object.
   */
  parse: (content: string): any => {
    try {
      return yaml.load(content);
    } catch (error) {
      console.error('YAML Parsing Error:', error);
      throw error;
    }
  },

  /**
   * Convert a JavaScript object into a YAML string.
   */
  stringify: (data: any): string => {
    try {
      return yaml.dump(data, {
        indent: 2,
        lineWidth: -1, // Don't wrap lines
        noRefs: true,
      });
    } catch (error) {
      console.error('YAML Stringify Error:', error);
      throw error;
    }
  }
};
