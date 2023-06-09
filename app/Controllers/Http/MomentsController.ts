import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Moment from 'App/Models/Moment'

import Application from '@ioc:Adonis/Core/Application'

export default class MomentsController {
  private validationOptions = {
    types: ['image'],
    size: '2mb',
  }

  public async store({ request, response }: HttpContextContract) {
    const body = request.body()

    if (!body.title || body.title.trim().length === 0 || /^\d/.test(body.title)) {
      return response.status(400).json({
        message:
          'O título é obrigatório, deve conter pelo menos um caractere e não pode começar com um número.',
      })
    }

    if (!body.description || body.description.trim().length === 0 || /^\d/.test(body.description)) {
      return response.status(400).json({
        message:
          'A descrição é obrigatória, deve conter pelo menos um caractere e não pode começar com um número.',
      })
    }

    const image = request.file('image', this.validationOptions)

    if (image) {
      const imageName = `${uuidv4()}.${image.extname}`

      await image.move(Application.tmpPath('upload'), {
        name: imageName,
      })

      body.image = imageName
    }

    const moment = await Moment.create(body)

    response.status(201)

    return {
      message: 'Momento criado com sucesso',
      data: moment,
    }
  }

  public async index() {
    // const moments = await Moment.all()
    const moments = await Moment.query().preload('comments')
    return {
      data: moments,
    }
  }

  public async show({ params }: HttpContextContract) {
    const moment = await Moment.findOrFail(params.id)

    await moment.load('comments')

    return {
      data: moment,
    }
  }

  public async destroy({ params }: HttpContextContract) {
    const moment = await Moment.findOrFail(params.id)

    await moment.delete()

    const imageName = moment.image

    if (imageName) {
      const imagePath = path.join(Application.tmpPath('upload'), imageName)
      await fs.unlink(imagePath)
    }

    return {
      message: 'Momento excluído com sucesso!',
      data: moment,
    }
  }

  public async update({ params, request, response }: HttpContextContract) {
    const body = request.body()

    const moment = await Moment.findOrFail(params.id)

    if (body.title) {
      if (!/^\d/.test(body.title)) {
        moment.title = body.title
      } else {
        return response.status(400).json({
          message: 'O título não pode começar com um número.',
        })
      }
    }

    if (body.description) {
      if (!/^\d/.test(body.description)) {
        moment.description = body.description
      } else {
        return response.status(400).json({
          message: 'A descrição não pode começar com um número.',
        })
      }
    }

    const image = request.file('image', this.validationOptions)

    if (image) {
      const imageToDelete = moment.image

      if (imageToDelete) {
        const imagePath = path.join(Application.tmpPath('upload'), imageToDelete)
        await fs.unlink(imagePath)
      }

      const imageName = `${uuidv4()}.${image.extname}`

      await image.move(Application.tmpPath('upload'), {
        name: imageName,
      })

      moment.image = imageName
    }
    await moment.save()

    return {
      message: 'Momento atualizado com sucesso!',
      data: moment,
    }
  }
}
