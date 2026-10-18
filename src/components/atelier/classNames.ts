export const joinClasses = (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' ');
