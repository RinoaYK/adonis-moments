import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Comment from 'App/Models/Comment'
import Moment from 'App/Models/Moment'

export default class CommentsController {
  public async store({ request, response, params }: HttpContextContract) {
    const body = request.body()
    const momentId = params.momentId

    const momentIdFind = await Moment.findOrFail(momentId)

    body.momentId = momentIdFind.id

    if (!body.userName || body.userName.trim().length === 0 || /^\d/.test(body.userName)) {
      return response.status(400).json({
        message:
          'O nomede usuário deve conter pelo menos um caractere e não pode começar com um número.',
      })
    }

    if (!body.content || body.content.trim().length === 0 || /^\d/.test(body.content)) {
      return response.status(400).json({
        message:
          'O comentário deve conter pelo menos um caractere e não pode começar com um número.',
      })
    }

    const comment = await Comment.create(body)

    response.status(201)

    return {
      message: 'Comentário criado com sucesso!',
      data: comment,
    }
  }

  public async index({ params }: HttpContextContract) {
    const momentId = params.momentId
    let comments: Comment[]

    if (momentId === '') {
      comments = await Comment.query().where('momentId', momentId)
    } else {
      comments = await Comment.all()
    }

    return {
      data: comments,
    }
  }

  public async show({ params }: HttpContextContract) {
    const comment = await Comment.findOrFail(params.id)

    return {
      data: comment,
    }
  }

  public async destroy({ params }: HttpContextContract) {
    const comment = await Comment.findOrFail(params.id)

    await comment.delete()

    return {
      message: 'Comentário excluído com sucesso!',
      data: comment,
    }
  }

  public async update({ params, request, response }: HttpContextContract) {
    const body = request.body()
    const comment = await Comment.findOrFail(params.id)

    if (body.userName) {
      if (!/^\d/.test(body.userName)) {
        comment.userName = body.userName
      } else {
        return response.status(400).json({
          message: 'Nome do usuário não pode começar com um número.',
        })
      }
    }

    if (body.content) {
      if (!/^\d/.test(body.content)) {
        comment.content = body.content
      } else {
        return response.status(400).json({
          message: 'O comentário não pode começar com um número.',
        })
      }
    }
    await comment.save()

    return {
      message: 'Comentário atualizado com sucesso!',
      data: comment,
    }
  }
}
