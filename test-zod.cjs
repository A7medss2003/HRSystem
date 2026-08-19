const { z } = require('zod');
try {
  z.object({a: z.string()}).parse({});
} catch(e) {
  console.log(e.errors);
}
