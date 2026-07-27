const TemplateModel = require('../models/templateModel');

class TemplateController {
  constructor() {
    this.templateModel = new TemplateModel();
  }

  async updateAttributes(req, res) {
    const { id_template } = req.params;
    const { 
      name_template_srv, 
      codi_template_srv, 
      desc_template_srv, 
      id_tipo_srv 
    } = req.body;

    try {
      const updatedTemplate = await this.templateModel.updateAttributes(id_template, {
        name_template_srv,
        codi_template_srv,
        desc_template_srv,
        id_tipo_srv
      });
      
      if (!updatedTemplate) {
        return res.status(404).json({ error: 'Template no encontrado' });
      }
      res.json({ message: 'Atributos del template actualizados correctamente', data: updatedTemplate });
    } catch (error) {
      console.error('Error in TemplateController.updateAttributes:', error);
      res.status(500).json({ error: 'Error del servidor al actualizar los atributos del template' });
    }
  }
}

module.exports = new TemplateController();
